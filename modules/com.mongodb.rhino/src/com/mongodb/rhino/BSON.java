/**
 * Copyright 2010 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.rhino;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.bson.BSONObject;
import org.bson.types.Binary;
import org.bson.types.ObjectId;
import org.bson.types.Symbol;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;

import com.mongodb.BasicDBObject;
import com.mongodb.DBRefBase;
import com.mongodb.rhino.util.Base64;

/**
 * Direct conversion between native Rhino objects and BSON.
 * <p>
 * This class can be used directly in Rhino.
 * 
 * @author Tal Liron
 */
public class BSON
{
	//
	// Static operations
	//

	/**
	 * Recursively convert from native JavaScript to BSON-compatible types.
	 * <p>
	 * Recognizes JavaScript objects, arrays, dates and primitives.
	 * <p>
	 * Also recognizes JavaScript objects adhering to MongoDB's extended JSON,
	 * converting them to BSON types: {$oid:'objectid'},
	 * {$binary:'base64',$type:'hex'}, {$ref:'collection',$id:'objectid'}.
	 * <p>
	 * Note that the {$date:timestamp} extended JSON format is supported as well
	 * as native JavaScript date objects.
	 * 
	 * @param object
	 *        A Rhino native object
	 * @return A BSON-compatible object
	 */
	public static Object to( Object object )
	{
		if( object instanceof NativeJavaObject )
		{
			// This happens either because the developer purposely creates a
			// Java object, or because it was returned from a Java call and
			// wrapped by Rhino.

			return ( (NativeJavaObject) object ).unwrap();
		}
		else if( object instanceof NativeArray )
		{
			// Convert Rhino array to list

			NativeArray array = (NativeArray) object;
			int length = (int) array.getLength();
			ArrayList<Object> bson = new ArrayList<Object>( length );

			for( int i = 0; i < length; i++ )
				bson.add( to( ScriptableObject.getProperty( array, i ) ) );

			return bson;
		}
		else if( object instanceof ScriptableObject )
		{
			ScriptableObject scriptable = (ScriptableObject) object;

			Object r = ExtendedJSON.fromExtendedJSON( scriptable, false );
			if( r != null )
				return r;

			String className = scriptable.getClassName();
			if( className.equals( "Date" ) )
			{
				// Convert NativeDate to Date

				// (The NativeDate class is private in Rhino, but we can access
				// it like a regular object.)

				Object time = ScriptableObject.callMethod( scriptable, "getTime", null );
				if( time instanceof Number )
					return new Date( ( (Number) time ).longValue() );
			}
			else if( className.equals( "String" ) )
			{
				// Unpack NativeString

				return scriptable.toString();
			}

			// Convert regular Rhino object

			BasicDBObject bson = new BasicDBObject();

			Object[] ids = scriptable.getAllIds();
			for( Object id : ids )
			{
				String key = id.toString();
				Object value = to( ScriptableObject.getProperty( scriptable, key ) );
				bson.put( key, value );
			}

			return bson;
		}
		else if( object instanceof Undefined )
		{
			return null;
		}
		else
			return object;
	}

	/**
	 * Recursively convert from BSON to native JavaScript types.
	 * <p>
	 * Converts to JavaScript objects, arrays, dates and primitives. The result
	 * is JSON-compatible.
	 * <p>
	 * Note that special MongoDB types (ObjectIds, Binary and DBRef) are not
	 * converted, but {@link JSON#to(Object)} recognizes them, so they can still
	 * be considered JSON-compatible in this limited sense. Use
	 * {@link #from(Object, boolean)} if you want to convert them MongoDB's
	 * extended JSON.
	 * 
	 * @param object
	 *        A BSON object
	 * @return A JSON-compatible Rhino object
	 */
	public static Object from( Object object )
	{
		return from( object, false );
	}

	/**
	 * Recursively convert from BSON to native JavaScript types.
	 * <p>
	 * Converts to JavaScript objects, arrays, dates and primitives. The result
	 * is JSON-compatible.
	 * <p>
	 * Can optionally convert MongoDB's types to extended JSON:
	 * {$oid:'objectid'}, {$binary:'base64',$type:'hex'},
	 * {$ref:'collection',$id:'objectid'}.
	 * <p>
	 * Note that even if they are not converted, {@link JSON#to(Object)}
	 * recognizes them, so they can still be considered JSON-compatible in this
	 * limited sense.
	 * 
	 * @param object
	 *        A BSON object
	 * @param extendedJSON
	 *        Whether to convert extended JSON objects
	 * @return A JSON-compatible Rhino object
	 */
	public static Object from( Object object, boolean extendedJSON )
	{
		if( object instanceof List<?> )
		{
			// Convert list to NativeArray

			List<?> list = (List<?>) object;
			NativeArray array = new NativeArray( list.size() );

			int index = 0;
			for( Object item : list )
				ScriptableObject.putProperty( array, index++, from( item, extendedJSON ) );

			return array;
		}
		else if( object instanceof BSONObject )
		{
			// Convert BSON object to NativeObject

			BSONObject bsonObject = (BSONObject) object;
			NativeObject nativeObject = new NativeObject();

			for( String key : bsonObject.keySet() )
			{
				Object value = from( bsonObject.get( key ), extendedJSON );
				ScriptableObject.putProperty( nativeObject, key, value );
			}

			return nativeObject;
		}
		else if( object instanceof Date )
		{
			// Convert Date to NativeDate

			// (The NativeDate class is private in Rhino, but we can create
			// it indirectly like a regular object.)

			Date date = (Date) object;
			Context context = Context.getCurrentContext();
			Scriptable scope = ScriptRuntime.getTopCallScope( context );
			Scriptable nativeDate = context.newObject( scope, "Date", new Object[]
			{
				date.getTime()
			} );

			return nativeDate;
		}
		else if( ( object instanceof ObjectId ) && extendedJSON )
		{
			// Convert MongoDB ObjectId to extended JSON $oid format

			NativeObject nativeObject = new NativeObject();
			ScriptableObject.putProperty( nativeObject, "$oid", ( (ObjectId) object ).toStringMongod() );
			return nativeObject;
		}
		else if( ( object instanceof DBRefBase ) && extendedJSON )
		{
			// Convert MongoDB ref to extended JSON $ref format

			DBRefBase ref = (DBRefBase) object;
			NativeObject nativeObject = new NativeObject();
			ScriptableObject.putProperty( nativeObject, "$ref", ref.getRef() );

			Object id = from( ref.getId(), true );
			if( id instanceof ObjectId )
				ScriptableObject.putProperty( nativeObject, "$id", ( (ObjectId) id ).toStringMongod() );
			else
				// Seems like this will break for aggregate _ids, but this is
				// what the MongoDB documentation says!
				ScriptableObject.putProperty( nativeObject, "$id", id.toString() );

			return nativeObject;
		}
		else if( ( object instanceof Binary ) && extendedJSON )
		{
			// Convert MongoDB Binary to extended JSON $binary format

			Binary binary = (Binary) object;
			NativeObject nativeObject = new NativeObject();
			ScriptableObject.putProperty( nativeObject, "$binary", Base64.encodeToString( binary.getData(), false ) );
			ScriptableObject.putProperty( nativeObject, "$type", Integer.toHexString( binary.getType() ) );
			return nativeObject;
		}
		else if( object instanceof Symbol )
		{
			return ( (Symbol) object ).getSymbol();
		}
		else
			return object;
	}
}
