/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm.nashorn;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import jdk.nashorn.api.scripting.ScriptObjectMirror;
import jdk.nashorn.internal.objects.NativeArray;
import jdk.nashorn.internal.objects.NativeRegExp;
import jdk.nashorn.internal.objects.NativeString;
import jdk.nashorn.internal.objects.annotations.Function;
import jdk.nashorn.internal.runtime.ConsString;
import jdk.nashorn.internal.runtime.Context;
import jdk.nashorn.internal.runtime.ScriptObject;
import jdk.nashorn.internal.runtime.Undefined;
import jdk.nashorn.internal.runtime.arrays.ArrayData;

import org.bson.BsonDocument;
import org.bson.Document;
import org.bson.types.Symbol;
import org.mozilla.javascript.NativeJavaObject;

import com.mongodb.jvm.BSON;
import com.mongodb.jvm.BsonImplementation;
import com.threecrickets.jvm.json.nashorn.util.NashornNativeUtil;

/**
 * Conversion between native Nashorn values and BSON-compatible values.
 * <p>
 * Recognizes Nashorn's {@link NativeArray}, {@link NativeJavaObject},
 * {@link NativeString}, {@link ConsString}, {@link NativeRegExp},
 * {@link Undefined}, {@link ScriptObject} and {@link Function}.
 * <p>
 * For BSON, recognizes both the high-level Document types and the low-level
 * BsonValue types.
 * <p>
 * Also recognizes <a
 * href="http://docs.mongodb.org/manual/reference/mongodb-extended-json/"
 * >MongoDB's extended JSON notation</a> via {@link MongoNashornJsonExtender}.
 * 
 * @author Tal Liron
 */
public class NashornBsonImplementation implements BsonImplementation
{
	//
	// Construction
	//

	public NashornBsonImplementation()
	{
		// Force a NoClassDefFoundError if Nashorn is not available
		ScriptObject.class.getClass();
	}

	//
	// BsonImplementation
	//

	public Object to( Object object )
	{
		// Unwrap if necessary
		if( object instanceof ScriptObjectMirror )
			object = ScriptObjectMirror.unwrap( object, Context.getGlobal() );

		if( object instanceof NativeRegExp )
		{
			String[] regExp = NashornNativeUtil.from( (NativeRegExp) object );

			// Note: We are not using the JVM's Pattern class because: it does
			// not support a "g" flag,
			// and initializing it would cause a regex compilation, which is not
			// what we want during
			// simple data conversion. In short, better to use a DBObject than a
			// Pattern, even though
			// the MongoDB does driver support Pattern instances (which we think
			// is a bad idea).

			Document bson = new Document();
			bson.put( "$regex", regExp[0] );
			bson.put( "$options", regExp[1] );
			return bson;
		}
		else if( object instanceof NativeArray )
		{
			// Convert Nashorn array to list

			ArrayData array = ( (NativeArray) object ).getArray();
			int length = (int) array.length();
			ArrayList<Object> bson = new ArrayList<Object>( length );

			for( int i = 0; i < length; i++ )
				bson.add( to( array.getObject( i ) ) );

			return bson;
		}
		else if( object instanceof ScriptObject )
		{
			ScriptObject scriptObject = (ScriptObject) object;

			// Is it in extended JSON format?
			Object r = jsonExtender.from( scriptObject, false );
			if( r != null )
				return r;

			r = NashornNativeUtil.from( scriptObject );
			if( r != null )
				return r;

			// Convert regular Nashorn object

			Document bson = new Document();

			for( String key : scriptObject.getOwnKeys( true ) )
			{
				Object value = to( getProperty( scriptObject, key ) );
				bson.put( key, value );
			}

			return bson;
		}
		else if( object instanceof Undefined )
		{
			Document bson = new Document();
			bson.put( "$undefined", true );
			return bson;
		}
		else if( ( object instanceof NativeString ) || ( object instanceof ConsString ) )
		{
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
		if( object instanceof BsonDocument )
		{
			Document document = BSON.toDocument( (BsonDocument) object );
			return from( document, extendedJSON );
		}
		if( object instanceof List<?> )
		{
			// Convert list to NativeArray

			List<?> list = (List<?>) object;
			NativeArray array = NashornNativeUtil.newArray( list.size() );

			int index = 0;
			for( Object item : list )
				array.set( index++, from( item, extendedJSON ), 0 );

			return array;
		}
		else if( object instanceof Map<?, ?> )
		{
			// Convert map to ScriptObject

			Map<?, ?> document = (Map<?, ?>) object;
			ScriptObject nativeObject = NashornNativeUtil.newObject();

			for( Map.Entry<?, ?> entry : document.entrySet() )
			{
				Object value = from( entry.getValue(), extendedJSON );
				nativeObject.put( entry.getKey(), value, false );
			}

			return nativeObject;
		}
		else if( object instanceof Long )
		{
			// Wrap Long so to avoid conversion into a NativeNumber (which would
			// risk losing precision!)

			return NashornNativeUtil.wrap( (Long) object );
		}
		else if( object instanceof Date )
		{
			return NashornNativeUtil.to( (Date) object );
		}
		else if( object instanceof Pattern )
		{
			return NashornNativeUtil.to( (Pattern) object );
		}
		else if( object instanceof Symbol )
		{
			return ( (Symbol) object ).getSymbol();
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

	private final MongoNashornJsonExtender jsonExtender = new MongoNashornJsonExtender();

	private static Object getProperty( ScriptObject scriptObject, String key )
	{
		Object value = scriptObject.get( key );
		if( value instanceof Undefined )
			return null;
		return value;
	}
}
