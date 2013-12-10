/**
 * Copyright 2010-2013 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm.rhino;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.regex.Pattern;

import jdk.nashorn.internal.objects.NativeString;

import org.bson.BSONObject;
import org.bson.types.Symbol;
import org.mozilla.javascript.ConsString;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.regexp.NativeRegExp;

import com.mongodb.BasicDBObject;
import com.mongodb.jvm.BsonImplementation;
import com.threecrickets.jvm.json.rhino.util.RhinoNativeUtil;

/**
 * Conversion between native Rhino values and BSON-compatible values.
 * <p>
 * Recognizes Rhino's {@link NativeArray}, {@link NativeJavaObject},
 * {@link NativeString}, {@link ConsString}, {@link NativeRegExp},
 * {@link Undefined}, {@link ScriptableObject} and {@link Function}.
 * <p>
 * Also recognizes <a
 * href="http://docs.mongodb.org/manual/reference/mongodb-extended-json/"
 * >MongoDB's extended JSON notation</a> via {@link MongoRhinoJsonExtender}.
 * 
 * @author Tal Liron
 */
public class RhinoBsonImplementation implements BsonImplementation
{
	//
	// BsonImplementation
	//

	public Object to( Object object )
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
			String[] regExp = RhinoNativeUtil.from( (NativeRegExp) object );

			// Note: We are not using the JVM's Pattern class because: it does
			// not support a "g" flag,
			// and initializing it would cause a regex compilation, which is not
			// what we want during
			// simple data conversion. In short, better to use a DBObject than a
			// Pattern, even though
			// the MongoDB does driver support Pattern instances (which we think
			// is a bad idea).

			BasicDBObject bson = new BasicDBObject();
			bson.put( "$regex", regExp[0] );
			bson.put( "$options", regExp[1] );
			return bson;
		}
		else if( object instanceof NativeArray )
		{
			// Convert Rhino array to list

			NativeArray nativeArray = (NativeArray) object;
			int length = (int) nativeArray.getLength();
			Object[] bson = new Object[length];

			for( int i = 0; i < length; i++ )
				bson[i] = to( ScriptableObject.getProperty( nativeArray, i ) );

			return Arrays.asList( bson );
		}
		else if( object instanceof ScriptableObject )
		{
			ScriptableObject scriptableObject = (ScriptableObject) object;

			// Is it in extended JSON format?
			Object r = jsonExtender.from( scriptableObject, false );
			if( r != null )
				return r;

			r = RhinoNativeUtil.from( scriptableObject );
			if( r != null )
				return r;

			// Convert regular Rhino object

			BasicDBObject bson = new BasicDBObject();

			Object[] ids = scriptableObject.getAllIds();
			for( Object id : ids )
			{
				String key = id.toString();
				Object value = to( ScriptableObject.getProperty( scriptableObject, key ) );
				bson.put( key, value );
			}

			return bson;
		}
		else if( object instanceof Undefined )
		{
			BasicDBObject bson = new BasicDBObject();
			bson.put( "$undefined", true );
			return bson;
		}
		else if( object instanceof CharSequence )
		{
			// This helps overcome an apparent bug in Rhino, whereby
			// org.mozilla.javascript.ConsString is not properly serializable
			// (see issue #6)
			return object.toString();
		}
		else
		{
			return object;
		}
	}

	public Object from( Object object )
	{
		return from( object, false );
	}

	public Object from( Object object, boolean extendedJSON )
	{
		if( object instanceof List<?> )
		{
			// Convert list to NativeArray

			List<?> list = (List<?>) object;
			Scriptable scriptable = RhinoNativeUtil.newArray( list.size() );

			int index = 0;
			for( Object item : list )
				ScriptableObject.putProperty( scriptable, index++, from( item, extendedJSON ) );

			return scriptable;
		}
		else if( object instanceof BSONObject )
		{
			// Convert BSON object to NativeObject

			BSONObject bsonObject = (BSONObject) object;
			Scriptable scriptable = RhinoNativeUtil.newObject();

			for( String key : bsonObject.keySet() )
			{
				Object value = from( bsonObject.get( key ), extendedJSON );
				ScriptableObject.putProperty( scriptable, key, value );
			}

			return scriptable;
		}
		else if( object instanceof Symbol )
		{
			return ( (Symbol) object ).getSymbol();
		}
		else if( object instanceof Date )
		{
			return RhinoNativeUtil.to( (Date) object );
		}
		else if( object instanceof Pattern )
		{
			return RhinoNativeUtil.to( (Pattern) object );
		}
		else if( object instanceof Long )
		{
			// Wrap Long so to avoid conversion into a NativeNumber (which would
			// risk losing precision!)

			return RhinoNativeUtil.wrap( (Long) object );
		}
		else
		{
			if( extendedJSON )
			{
				Object r = jsonExtender.to( object, true, false );
				if( r != null )
					return r;
			}

			return object;
		}
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private final MongoRhinoJsonExtender jsonExtender = new MongoRhinoJsonExtender();
}
