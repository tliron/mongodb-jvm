/**
 * Copyright 2010-2011 Three Cricketsckets LLC.
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
import java.util.regex.Pattern;

import org.bson.BSONObject;
import org.bson.types.Symbol;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.regexp.NativeRegExp;

import com.mongodb.BasicDBObject;

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
	 * Recognizes JavaScript objects, arrays, Date objects, RegExp objects and
	 * primitives.
	 * <p>
	 * Also recognizes JavaScript objects adhering to MongoDB's extended JSON,
	 * converting them to BSON types: {$oid:'objectid'},
	 * {$binary:'base64',$type:'hex'}, {$ref:'collection',$id:'objectid'}.
	 * <p>
	 * Note that the {$date:timestamp} and {$regex:'pattern',$options:'options'}
	 * extended JSON formats are recognized as well as native JavaScript Date
	 * and RegExp objects.
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
		else if( object instanceof NativeRegExp )
		{
			NativeRegExp regExp = (NativeRegExp) object;
			Object source = ScriptableObject.getProperty( regExp, "source" );

			Object isGlobal = ScriptableObject.getProperty( regExp, "global" );
			Object isIgnoreCase = ScriptableObject.getProperty( regExp, "ignoreCase" );
			Object isMultiLine = ScriptableObject.getProperty( regExp, "multiline" );

			// Note: JVM pattern does not support a "g" flag. Also, compiling
			// the pattern here is a waste of time. In short, better to use a
			// DBObject than a Pattern, even though the MongoDB driver supports
			// Pattern instances:
			//
			// int flags = 0;
			// if( ( isIgnoreCase instanceof Boolean ) && ( ( (Boolean)
			// isIgnoreCase ).booleanValue() ) )
			// flags |= Pattern.CASE_INSENSITIVE;
			// if( ( isMultiLine instanceof Boolean ) && ( ( (Boolean)
			// isMultiLine ).booleanValue() ) )
			// flags |= Pattern.MULTILINE;
			// return Pattern.compile( source.toString(), flags );

			String options = "";
			if( ( isGlobal instanceof Boolean ) && ( ( (Boolean) isGlobal ).booleanValue() ) )
				options += "g";
			if( ( isIgnoreCase instanceof Boolean ) && ( ( (Boolean) isIgnoreCase ).booleanValue() ) )
				options += "i";
			if( ( isMultiLine instanceof Boolean ) && ( ( (Boolean) isMultiLine ).booleanValue() ) )
				options += "m";

			BasicDBObject bson = new BasicDBObject();
			bson.put( "$regex", source.toString() );
			bson.put( "$options", source.toString() );
			return bson;
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

			// Is it in extended JSON format?
			Object r = ExtendedJSON.from( scriptable, false );
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
		{
			return object;
		}
	}

	/**
	 * Recursively convert from BSON to native JavaScript values.
	 * <p>
	 * Converts to JavaScript objects, arrays, Date objectss and primitives. The
	 * result is JSON-compatible.
	 * <p>
	 * Note that special MongoDB types (ObjectIds, Binary and DBRef) are not
	 * converted, but {@link JSON#to(Object)} recognizes them, so they can still
	 * be considered JSON-compatible in this limited sense. Use
	 * {@link #from(Object, boolean)} if you want to convert them to MongoDB's
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
	 * Recursively convert from BSON to native JavaScript values.
	 * <p>
	 * Converts to JavaScript objects, arrays, Date objects, RegExp objects and
	 * primitives. The result is JSON-compatible.
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
		else if( object instanceof Symbol )
		{
			return ( (Symbol) object ).getSymbol();
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
		else if( object instanceof Pattern )
		{
			// Convert Pattern to NativeRegExp

			Pattern pattern = (Pattern) object;
			String regex = pattern.toString();
			int flags = pattern.flags();
			String options = "";
			if( ( flags & Pattern.CASE_INSENSITIVE ) != 0 )
				options += 'i';
			if( ( flags & Pattern.MULTILINE ) != 0 )
				options += 'm';

			// Note: JVM pattern does not support a "g" flag

			Context context = Context.getCurrentContext();
			Scriptable scope = ScriptRuntime.getTopCallScope( context );
			Scriptable nativeRegExp = context.newObject( scope, "RegExp", new Object[]
			{
				regex, options
			} );

			return nativeRegExp;
		}
		else if( object instanceof String )
		{
			// Convert String to NativeString

			// (Rhino deals reasonably well with regular JVM strings, but these
			// do not support the JavaScript String prototype!)

			String string = (String) object;
			Context context = Context.getCurrentContext();
			Scriptable scope = ScriptRuntime.getTopCallScope( context );
			Scriptable nativeString = context.newObject( scope, "String", new Object[]
			{
				string
			} );

			return nativeString;
		}
		else
		{
			if( extendedJSON )
			{
				Object r = ExtendedJSON.to( object, true );
				if( r != null )
					return r;
			}

			return object;
		}
	}
}
